using Services;


public interface IBotMessage<T>
{
    string MessageSubject { get; } 
    T Data { get; }
}

public class WorkLog : IBotMessage<string>
{
    public string MessageSubject => typeof(WorkLog).Name;
    public string Data { get; set; }

    public WorkLog(string workLog)
    {
        Data = workLog;
    }
}

public class DocumentUpdate : IBotMessage<ContractWithValidations>
{
    public string MessageSubject => typeof(DocumentUpdate).Name;
    public ContractWithValidations Data { get; set; }

    public DocumentUpdate(ContractWithValidations contractWithValidations)
    {
        Data = contractWithValidations;
    }
}

public class ErrorMessage : IBotMessage<string>
{
    public string MessageSubject => typeof(ErrorMessage).Name;
    public string Data { get; set; }

    public ErrorMessage(string errorMessage)
    {
        Data = errorMessage;
    }
}

public class ContractWithValidations {
    public required Contract Contract { get; set; }
    public required List<ValidationInsight> Validations { get; set; }
}

public class UICommand : IBotMessage<ComponentRef> {

    public string MessageSubject => typeof(UICommand).Name;
    public ComponentRef Data { get; set; }

    public UICommand(string componentName, IDictionary<string, object> properties)
    {
        Data = new ComponentRef(componentName, properties);
    }
}

public class ComponentRef {
    public string Name { get; set; }
    public IDictionary<string, object> Properties { get; set; }

    public ComponentRef(string name, IDictionary<string, object> properties)
    {
        Name = name;
        Properties = properties;
    }
}

